import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export class AuthenticationError extends Error {
 status:number;
 constructor(message='Sign in required.',status=401){super(message);this.name='AuthenticationError';this.status=status;}
}
export async function verifyFirebaseToken(token:string,projectId:string,keys:JWTVerifyGetKey=googleKeys){
 if(!token||token.length>8192||!projectId)throw new AuthenticationError();
 let payload;
 try{({payload}=await jwtVerify(token,keys,{issuer:`https://securetoken.google.com/${projectId}`,audience:projectId,algorithms:['RS256'],requiredClaims:['exp','iat','auth_time','sub','email','email_verified'],maxTokenAge:'65m',clockTolerance:5}));}catch{throw new AuthenticationError('Your session has expired. Sign in again.');}
 const now=Math.floor(Date.now()/1000);
 if(!payload.sub||payload.sub.length>128||typeof payload.email!=='string'||!/^\S+@\S+\.\S+$/.test(payload.email)||typeof payload.auth_time!=='number'||payload.auth_time<=0||payload.auth_time>now+5)throw new AuthenticationError();
 if(payload.email_verified!==true)throw new AuthenticationError('Verify your email before accessing the workspace.',403);
 return {userId:payload.sub,email:payload.email.toLowerCase(),displayName:typeof payload.name==='string'?payload.name:payload.email};
}
