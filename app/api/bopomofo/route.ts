import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;
const DATABASE_NAME = 'bopomofoDB';
const COLLECTION_NAME = 'bopomofo';

if (!MONGODB_URI || !DATABASE_NAME || !COLLECTION_NAME) {
    throw new Error(
        "Please define the MONGODB_URI, MONGODB_DATABASE and MONGODB_COLLECTION environment variables"
      );
}

interface BopomofoDocument {
  label: string;
  text: string;
}

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI!, {
            dbName: DATABASE_NAME,
        });
        console.log('Connected to MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

const bopomofoSchema = new mongoose.Schema<BopomofoDocument>({
    label: String,
    text: String
});

const Bopomofo = mongoose.models.Bopomofo || mongoose.model<BopomofoDocument>(COLLECTION_NAME!, bopomofoSchema, COLLECTION_NAME);



export async function GET() {
    try {
        const connection = await connectToDatabase();
        if (!connection) {
            return NextResponse.json({ error: "Database connection failed"}, { status: 500});
        }

        // Fetch 30 random documents
        // Fetch 30 random documents
        const randomDocuments = await Bopomofo.aggregate([{$sample: {size: 30}}]);

         if(randomDocuments && randomDocuments.length > 0) {
            return NextResponse.json({ phonetics: randomDocuments }, { status: 200 });
          } else {
            return NextResponse.json({error: "No documents found"}, {status: 404})
          }
    } catch (error) {
        console.error("Failed to fetch random document:", error);
        return NextResponse.json({ error: 'Failed to fetch random documents' }, { status: 500 });
    } finally {
        // Disconnect from MongoDB after the response
         if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
             console.log("Disconnected from MongoDB")
         }
    }
}