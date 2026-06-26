const { JWT } = require('google-auth-library');

async function main() {
  const client = new JWT({
    email: 'firebase-adminsdk-fbsvc@tribal-joy-212504.iam.gserviceaccount.com',
    key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1hOTpV3fNc2m8
rpPkSPXxjxeaACgKK+uDtJkcGcsj0QGvaDZaXaBBrFmTPTvPh17fN1rMYxvH/BsR
Di5cUMRP8SaHn7lq6vamoZXsYP13wJPsrXOzURQtSO8v+9VSaqbjuA4ksqBLZl0b
7tDidjoyyyzh5Ty0QEgefxyWkjRIOeil+3tZiExx9eYe9S3Se3qiVQIjwx5ndHHT
nO+O9c89COY+0vb1r4Gok46IxhwMMzO4AXbqGc99QcP1MFGg7DcvzeaN5YVGx7Kq
k421SMGDyWpLmyM5+1xq2LPdvHrr/4bVyKB22Fmd8n1hA/DRb6zLDONYthOlzhgt
GVnDo4gdAgMBAAECggEAA/3bT3r3bPgBQWobYXVDR0pswUZd8F9Si1pmKt/cVOTM
jdq+UJK81UTg0WPoKUz3m/P/1f0bSB9gnv7kq8NblcsenEk5uW1XpYa/IRa+7Cpl
dlptcBTeheJpNBvBxKazayWJ1hUW1kxMIYhJD/nRQiWv+SW32y+LW8moIMgv8yNI
C43IbU0cBTPIBzCveAZOq2nPYBUS8yaVGzKt8pwFKPtdfEmBPWYCv/VYd5EYAxal
WDnP7n3OFXe5RO0x7PX94DGH4b7ZX52kQjV2u1UonX9j4x81Rb82H1xpigP1Q+yB
iaw36mVUcWppkTPm+9UqVmlVdWPWsrriDws+2N8NdwKBgQDdr+4nxgu8PK1jkYBV
H1s78Kk/t6216WqtQUGH+59y5ifSBNArTRmvK5QbPUvT3m4Udu3zNTAf8ReqlV8K
sE1T1pEuB4UA/Vwa9xOO9LNIYOehuvdG/6xtCxgQyedB8W590CNMU59s2L5QKquS
vpwWGFzDM6/ntNTwlY+zCx0zqwKBgQDRnVq/psDdmeOLHRg9y5ci4n6HrJLfBeSJ
m05w6MFd6HmsGynexXcnbq5u1wchsE2G9LmakUjp6Tg1Ylce8dHPJ3yYresysytA
kZd0Dm/DzbSgLkXwuQ2PM7kEOfco9BgLNfJCDs9hOZRl4vsqVyE+Xuc3FC9WYjNO
3KwK8dvrVwKBgFqjMqEKZQPqXw3lkG29K0UfiWNmytwkehwqIQvjAfctSLyigSYj
GMw46g4VCqquN52gXntglLOKlB2HgttQ59zOTn9eTa/w5raTrGh3fdGq5SmH0tAx
eqL+tTEwC6A3gPBpp/Tt/7G2EGGggJO34QNbpJmeyV3X3nQbAiy275KPAoGBAIVR
ATC3jB7lC1WlMY/L9toXF8aOufLiupHSlzc0shdaDliqBh1LlhccTBDu7fg9O3HE
IG/wS2GKFVfOrf5easTIJnSs2NQsJCwy7RLBQ9BS+riN9am+6KLVkKzheRMw/EHV
E7lz1e3OQ1Xx4TDyrZAPqBrd2aWlW2Ci9UEYxniNAoGBAJgKAb76QACzlS+rZ+yT
XF62gTgm5pLdghCTsP+e6In8V4X6HjGs20dHhSpl75gr3zwDBgrnBIJcruft1uEL
bjmXZxgO1+pxoOxbc7VUKF3GtKX4ULAC657UuibRtxtCJPPjnax82yDx8D6/iWeb
Mv9/ao2dZvU6bkMD/PdAkr5x
-----END PRIVATE KEY-----\n`,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  await client.authorize();
  const projectId = 'tribal-joy-212504';
  const { data: clients } = await client.request({
    url: `https://oauth2.googleapis.com/v1/projects/${projectId}/oauthClients`,
    method: 'GET',
  });
  console.log('OAuth Clients:', JSON.stringify(clients, null, 2));
  const { data: webApps } = await client.request({
    url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
    method: 'GET',
  });
  console.log('Firebase Web Apps:', JSON.stringify(webApps, null, 2));
  const { data: config } = await client.request({
    url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/-/config`,
    method: 'GET',
  });
  console.log('Firebase Web Config:', JSON.stringify(config, null, 2));
}
main().catch(console.error);
