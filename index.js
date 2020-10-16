let _refreshUrl;
let _accessTokenKey;
let _refreshTokenKey;

export default async function setup({
  authURL,
  tokenIssuerUrl,
  refreshUrl,
  redirectUrl,
  accessTokenKey,
  refreshTokenKey
} = { authURL: '', tokenIssuerUrl: '', refreshUrl: '', redirectUrl: '', accessTokenKey: 'accessToken', refreshTokenKey: 'refreshToken' }) {
  _refreshUrl = refreshUrl;
  _accessTokenKey = accessTokenKey || 'accessToken';
  _refreshTokenKey = refreshTokenKey || 'refreshToken';
  const valid = await validateAuth();
  if (!valid) window.location = `${authURL}?b=${tokenIssuerUrl}&r=${redirectUrl}`;
}

async function validateAuth() {
  const decodedAccess = decode(localStorage.getItem(_accessTokenKey));
  const validAccess = decodedAccess && decodedAccess.exp && (new Date(parseInt(decodedAccess.exp) * 1000) > new Date());
  if (validAccess) return true;

  // try refreshing
  const data = await fetch(_refreshUrl, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: localStorage.getItem(_refreshTokenKey)
    })
  })
    .then(response => response.json())
    .catch(e => {
      console.error(e);
    });

  if (data && data.accessToken) {
    localStorage.setItem(_accessTokenKey, data.accessToken);
    return true;
  }

  return false;
}

function decode(token = '') {
  if (!token) return null;
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}
