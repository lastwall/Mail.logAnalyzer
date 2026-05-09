from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from .database import SessionLocal, engine, get_db
from . import models, parser
import os

# Initialize DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mail Log Analyzer API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/logs/process")
async def process_logs(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    log_dir = os.path.join(os.getcwd(), "logs")
    background_tasks.add_task(parser.parse_mail_logs, log_dir, db)
    return {"message": "Log processing started in background"}

from sqlalchemy import text

@app.get("/api/stats/overview")
async def get_overview(days: int = 0, db: Session = Depends(get_db)):
    # Base filter for timeframe
    time_filter = ""
    if days > 0:
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        time_filter = f"AND timestamp >= '{start_date}'"
    
    def get_count(status=None):
        sql = "SELECT COUNT(*) FROM email_logs WHERE 1=1"
        if status:
            sql += f" AND status = '{status}'"
        sql += f" {time_filter}"
        
        result = db.execute(text(sql)).fetchone()
        return result[0] if result else 0

    total = get_count()
    sent = get_count("sent")
    bounced = get_count("bounced")
    deferred = get_count("deferred")
    
    return {
        "total": total,
        "sent": sent,
        "bounced": bounced,
        "deferred": deferred,
        "success_rate": round((sent / total * 100), 2) if total > 0 else 0
    }

@app.get("/api/stats/volume")
async def get_volume(days: int = 7, db: Session = Depends(get_db)):
    time_filter = ""
    if days > 0:
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        time_filter = f"AND timestamp >= '{start_date}'"
        
    sql = f"""
        SELECT 
            date(timestamp) as date_str, 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounces
        FROM email_logs 
        WHERE 1=1 {time_filter}
        GROUP BY date_str
        ORDER BY date_str
    """
    
    results = db.execute(text(sql)).fetchall()
    return [{"date": r[0], "count": r[1], "bounces": r[2]} for r in results]

@app.get("/api/stats/top-senders")
async def get_top_senders(limit: int = 10, days: int = 0, db: Session = Depends(get_db)):
    time_filter = ""
    if days > 0:
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        time_filter = f"AND timestamp >= '{start_date}'"
        
    sql = f"""
        SELECT sender, COUNT(*) as count
        FROM email_logs
        WHERE 1=1 {time_filter}
        GROUP BY sender
        ORDER BY count DESC
        LIMIT {limit}
    """
    
    results = db.execute(text(sql)).fetchall()
    return [{"sender": r[0], "count": r[1]} for r in results]

@app.get("/api/stats/bounces-by-sender")
async def get_bounces_by_sender(limit: int = 10, days: int = 0, db: Session = Depends(get_db)):
    time_filter = ""
    if days > 0:
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        time_filter = f"AND timestamp >= '{start_date}'"
        
    sql = f"""
        SELECT sender, COUNT(*) as count
        FROM email_logs
        WHERE status = 'bounced' {time_filter}
        GROUP BY sender
        ORDER BY count DESC
        LIMIT {limit}
    """
    
    results = db.execute(text(sql)).fetchall()
    return [{"sender": r[0], "count": r[1]} for r in results]

@app.get("/api/stats/issues")
async def get_issues(db: Session = Depends(get_db)):
    results = db.query(
        models.EmailLog.reason,
        func.count(models.EmailLog.id).label('count')
    ).filter(models.EmailLog.status != "sent").group_by(models.EmailLog.reason).order_by(desc('count')).limit(10).all()
    
    return [{"reason": r.reason, "count": r.count} for r in results]

@app.get("/api/logs")
async def get_logs(
    page: int = 1, 
    limit: int = 50, 
    search: str = None, 
    status: str = None,
    days: int = 0,
    sort_by: str = "timestamp",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    
    # Sanitize sort parameters
    allowed_cols = ["timestamp", "sender", "recipient", "status", "message_id", "reason"]
    if sort_by not in allowed_cols:
        sort_by = "timestamp"
    if order.lower() not in ["asc", "desc"]:
        order = "desc"

    where_clauses = ["1=1"]
    if search:
        s = search.replace("'", "''")
        where_clauses.append(f"(sender LIKE '%{s}%' OR recipient LIKE '%{s}%' OR message_id LIKE '%{s}%' OR reason LIKE '%{s}%')")
    if status:
        where_clauses.append(f"status = '{status}'")
    if days > 0:
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        where_clauses.append(f"timestamp >= '{start_date}'")
    
    where_sql = " AND ".join(where_clauses)
    
    sql_count = f"SELECT COUNT(*) FROM email_logs WHERE {where_sql}"
    sql_data = f"SELECT * FROM email_logs WHERE {where_sql} ORDER BY {sort_by} {order.upper()}, timestamp DESC LIMIT {limit} OFFSET {offset}"
    
    total = db.execute(text(sql_count)).fetchone()[0]
    results = db.execute(text(sql_data)).fetchall()
    
    data = []
    for r in results:
        data.append({
            "id": r[0], "message_id": r[1], "timestamp": r[2], "sender": r[3],
            "recipient": r[4], "size": r[5], "status": r[6], "reason": r[7],
            "delay": r[8], "client_ip": r[9], "is_suspicious": r[10],
            "raw_log": r[11]
        })
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/logs/suspicious")
async def get_suspicious(page: int = 1, limit: int = 50, days: int = 0, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    
    where_clauses = ["is_suspicious = 1"]
    if days > 0:
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        where_clauses.append(f"timestamp >= '{start_date}'")
        
    where_sql = " AND ".join(where_clauses)
    
    sql_count = f"SELECT COUNT(*) FROM email_logs WHERE {where_sql}"
    sql_data = f"""
        SELECT * FROM email_logs 
        WHERE {where_sql}
        ORDER BY timestamp DESC
        LIMIT {limit} OFFSET {offset}
    """
    
    total = db.execute(text(sql_count)).fetchone()[0]
    results = db.execute(text(sql_data)).fetchall()
    
    # Convert to list of dicts for JSON serialization
    data = []
    for r in results:
        # Note: we need to handle the column mapping here since it's raw SQL
        # Using _asdict() if available or manual mapping
        data.append({
            "id": r[0],
            "message_id": r[1],
            "timestamp": r[2],
            "sender": r[3],
            "recipient": r[4],
            "size": r[5],
            "status": r[6],
            "reason": r[7],
            "delay": r[8],
            "client_ip": r[9],
            "is_suspicious": r[10],
            "raw_log": r[11]
        })
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/system/status")
async def get_system_status(db: Session = Depends(get_db)):
    last_processed = db.query(models.SystemSettings).filter(models.SystemSettings.key == "last_processed").first()
    return {
        "last_processed": last_processed.value if last_processed else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
