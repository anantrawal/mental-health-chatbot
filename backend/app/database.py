from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=False,
        )
        db = client[settings.DB_NAME]
        # Test connection
        await client.admin.command('ping')
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.messages.create_index([("user_id", 1), ("created_at", -1)])
        await db.mood_entries.create_index([("user_id", 1), ("created_at", -1)])
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("App starting without MongoDB — fix connection string!")
        # Don't raise — let the app start so Render detects the port


async def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def get_db():
    return db