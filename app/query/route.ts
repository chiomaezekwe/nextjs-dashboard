 import postgres from 'postgres';

 
// Log the DB URL to check it's correct
console.log("DB URL:", process.env.POSTGRES_URL);

 const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

 async function listInvoices() {
 	const data = await sql`
     SELECT invoices.amount, customers.name
     FROM invoices
     JOIN customers ON invoices.customer_id = customers.id
     WHERE invoices.amount = 666;
   `;

 	return data;
 }

export async function GET() {
  //return Response.json({
    //message:
      //'Uncomment this file and remove this line. You can delete this file when you are finished.',
  //});
   try {
   	return Response.json(await listInvoices());
   } catch (error) {
   	return Response.json({ error }, { status: 500 });
   }
}
