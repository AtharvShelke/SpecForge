import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const transitions = [
            ['draft', 'DRAFT'],
            ['pending', 'PENDING'],
            ['paid', 'PAID'],
            ['overdue', 'OVERDUE'],
            ['cancelled', 'CANCELLED'],
            ['refunded', 'REFUNDED'],
            ['voided', 'VOIDED']
        ];

        for (const [oldVal, newVal] of transitions) {
            try {
                await client.query(`ALTER TYPE "InvoiceStatus" RENAME VALUE '${oldVal}' TO '${newVal}';`);
                console.log(`Renamed InvoiceStatus from ${oldVal} to ${newVal}`);
            } catch (err: any) {
                console.error(`Failed to rename ${oldVal} to ${newVal}:`, err.message);
            }
        }

        console.log('Completed enum updates.');
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

main();
