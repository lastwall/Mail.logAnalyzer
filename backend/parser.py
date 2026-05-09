import re
import os
import glob
from datetime import datetime
from sqlalchemy.orm import Session
from .models import EmailLog, SystemSettings
from dateutil import parser as date_parser

# Regex patterns for Postfix logs
QID_PATTERN = r'([0-9A-F]{10,12}):'
FROM_PATTERN = r'from=<([^>]+)>, size=(\d+)'
TO_PATTERN = r'to=<([^>]+)>, relay=([^,]+), delay=([^,]+), delays=([^,]+), dsn=([^,]+), status=([a-zA-Z]+) \((.+)\)'
TO_PATTERN_SHORT = r'to=<([^>]+)>, relay=([^,]+), delay=([^,]+), delays=([^,]+), dsn=([^,]+), status=([a-zA-Z]+)'

def parse_mail_logs(log_dir: str, db: Session):
    log_files = glob.glob(os.path.join(log_dir, "mail.log*"))
    # Sort files: mail.log, mail.log.1, mail.log.2 ...
    log_files.sort(key=lambda x: (len(x), x))
    
    # In-memory store for correlating message IDs before saving
    # {qid: {timestamp, sender, size, recipients: [{recipient, status, reason, delay}]}}
    pending_emails = {}

    for log_file in log_files:
        print(f"Processing {log_file}...")
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                qid_match = re.search(QID_PATTERN, line)
                if not qid_match:
                    continue
                
                qid = qid_match.group(1)
                
                ts_str = " ".join(line.split()[:3])
                try:
                    current_year = datetime.now().year
                    dt = date_parser.parse(f"{ts_str} {current_year}")
                except:
                    dt = datetime.now()

                if qid not in pending_emails:
                    pending_emails[qid] = {'timestamp': dt, 'sender': 'unknown', 'size': 0, 'recipients': [], 'lines': []}
                
                pending_emails[qid]['lines'].append(line.strip())

                # Case 1: Sender info
                from_match = re.search(FROM_PATTERN, line)
                if from_match:
                    pending_emails[qid]['sender'] = from_match.group(1)
                    pending_emails[qid]['size'] = int(from_match.group(2))
                    continue

                # Case 2: Recipient/Status info
                to_match = re.search(TO_PATTERN, line) or re.search(TO_PATTERN_SHORT, line)
                if to_match:
                    recipient = to_match.group(1)
                    status = to_match.group(6)
                    delay = float(to_match.group(3))
                    reason = to_match.group(7) if len(to_match.groups()) >= 7 else ""
                    
                    entry = {
                        'recipient': recipient,
                        'status': status,
                        'reason': reason,
                        'delay': delay
                    }
                    pending_emails[qid]['recipients'].append(entry)

    # Fetch existing keys to avoid duplicates
    # We use a set of tuples (message_id, recipient, timestamp) for fast lookup
    print("Fetching existing record keys for deduplication...")
    existing_records = set(
        db.query(EmailLog.message_id, EmailLog.recipient, EmailLog.timestamp).all()
    )
    
    new_entries_count = 0
    # Bulk save to DB
    for qid, data in pending_emails.items():
        for rcpt in data['recipients']:
            # Create the unique key for this delivery
            key = (qid, rcpt['recipient'], data['timestamp'])
            
            if key not in existing_records:
                db_log = EmailLog(
                    message_id=qid,
                    timestamp=data['timestamp'],
                    sender=data['sender'],
                    recipient=rcpt['recipient'],
                    size=data['size'],
                    status=rcpt['status'],
                    reason=rcpt['reason'],
                    delay=rcpt['delay'],
                    is_suspicious=1 if rcpt['status'] in ['bounced', 'rejected'] else 0,
                    raw_log="\n".join(data['lines'])
                )
                db.add(db_log)
                new_entries_count += 1
                # Add to set to handle duplicates within the same batch if any
                existing_records.add(key)
    
    if new_entries_count > 0:
        db.commit()
        print(f"Committed {new_entries_count} new log entries.")
    else:
        print("No new logs to add.")
    
    # Update last processed time
    last_processed = db.query(SystemSettings).filter(SystemSettings.key == "last_processed").first()
    if not last_processed:
        last_processed = SystemSettings(key="last_processed", value=datetime.now().isoformat())
        db.add(last_processed)
    else:
        last_processed.value = datetime.now().isoformat()
    db.commit()

    print(f"Finished processing logs. Correlated {len(pending_emails)} messages.")
