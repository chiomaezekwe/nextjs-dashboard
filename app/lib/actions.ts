'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' }); 
/*const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  //invalid_type_error: 'Please select a customer.',
    required_error: 'Please select a customer.',
}),
  //amount: z.coerce.number(),
  //.gt(0, { message: 'Please enter an amount greater than $0.' }),
  //status: z.enum(['pending', 'paid']),
  //invalid_type_error: 'Please select an invoice status.',

  amount: z.coerce.number({
      required_error: 'Please enter an amount.',
      invalid_type_error: 'Amount must be a number.',
    })
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    required_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});*/

const FormSchema = z.object({
  id: z.string(),

  customerId: z.string({
    required_error: "Please select a customer.",
  }),

  amount: z.coerce
    .number({
      required_error: "Please enter an amount.",
      invalid_type_error: "Amount must be a number.",
    })
    .gt(0, { message: "Please enter an amount greater than $0." }),

  status: z.enum(["pending", "paid"], {
    required_error: "Please select an invoice status.",
  }),

  date: z.string(),
});

 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({    
//export async function createInvoice(formData: FormData) {
    //const { customerId, amount, status } = CreateInvoice.parse({
    //const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        // We'll also log the error to the console for now
        console.error(error);
    
    // If a database error occurs, return a more specific error.   
    return {
        message: 'Database Error: Failed to Create Invoice.',
    };
    //throw new Error('Database Error: Failed to Create Invoice.');
  }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
        // Test it out:
        //console.log(rawFormData);
}

//start -  added this line myself to fix error "Module '@/app/lib/actions' has no exported member 'updateInvoice'."
/*export async function updateInvoice(id: string, formData: FormData) {
    const customerId = formData.get('customerId') as string;
    const amount = Number(formData.get('amount'));
    const status = formData.get('status') as 'pending' | 'paid';*/

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId},
        amount = ${amount},
        status = ${status}
    WHERE id = ${id};
  `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return { message: 'Database Error: Failed to Update Invoice.' };
    //throw new Error('Database Error: Failed to Update Invoice.');
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
} // end - added this line myself to fix error "Module '@/app/lib/actions' has no exported member 'updateInvoice'."

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}





