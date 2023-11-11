/**
 * install jsonwebtoken
 * jwt.sign(payload, secret, {expiresIn: '1h})
 * token client
 */

/**
 * how to store token in the client side
 * 1. memory --> ok type
 * 2. local storage --> ok type (XSS)
 * 3. cookies: http only
 */

/**
 * 1. set cookies with http only (for development secure: false)
 * 2. cors setting
 * app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
    }));
    this cors setting is important
 * 3. set cookies to browser from client side with withCredentials by axios settings
    in axios set withCredentials: true
 */