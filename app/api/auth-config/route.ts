import {firebaseConfig} from '../../firebase-auth';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(firebaseConfig(),{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return Response.json({error:'Sign-in is not configured yet.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
