import {env} from 'cloudflare:workers';
import {AuthenticationError,verifyFirebaseToken} from '../src/firebase-token';
export type FirebaseWebConfig={apiKey:string;authDomain:string;projectId:string;appId:string};
export function firebaseConfig():FirebaseWebConfig {
 const value=(env as unknown as {SKANC_FIREBASE_CONFIG?:string}).SKANC_FIREBASE_CONFIG;
 if(!value)throw new AuthenticationError('Sign-in is not configured yet.',503);
 try{const parsed=JSON.parse(value) as FirebaseWebConfig;if(!parsed.apiKey||!parsed.authDomain||!parsed.projectId||!parsed.appId)throw new Error();return {apiKey:parsed.apiKey,authDomain:parsed.authDomain,projectId:parsed.projectId,appId:parsed.appId};}catch{throw new AuthenticationError('Sign-in is not configured yet.',503);}
}
export async function getFirebaseUser(request:Request){
 const authorization=request.headers.get('authorization');
 if(!authorization?.startsWith('Bearer '))throw new AuthenticationError();
 return verifyFirebaseToken(authorization.slice(7),firebaseConfig().projectId);
}
