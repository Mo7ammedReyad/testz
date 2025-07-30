import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC07Gs8L5vxlUmC561PKbxthewA1mrxYDk",
  authDomain: "zylos-test.firebaseapp.com",
  databaseURL: "https://zylos-test-default-rtdb.firebaseio.com",
  projectId: "zylos-test",
  storageBucket: "zylos-test.firebasestorage.app",
  messagingSenderId: "553027007913",
  appId: "1:553027007913:web:2daa37ddf2b2c7c20b00b8"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)

const app = new Hono()

// Enable CORS
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// JWT Secret (in production, use environment variables)
const JWT_SECRET = 'your-secret-key-here'

// Signup endpoint
app.post('/signup', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // Create user with Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Generate JWT token
    const token = await sign({ 
      uid: user.uid, 
      email: user.email 
    }, JWT_SECRET)

    return c.json({
      message: 'User created successfully',
      user: {
        uid: user.uid,
        email: user.email
      },
      token
    })
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ 
      error: error.message || 'Failed to create user' 
    }, 400)
  }
})

// Login endpoint
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Generate JWT token
    const token = await sign({ 
      uid: user.uid, 
      email: user.email 
    }, JWT_SECRET)

    return c.json({
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ 
      error: error.message || 'Invalid credentials' 
    }, 401)
  }
})

// Protected route example
app.get('/profile', jwt({ secret: JWT_SECRET }), async (c) => {
  const payload = c.get('jwtPayload')
  
  return c.json({
    message: 'Access granted to protected route',
    user: payload
  })
})

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Hono Firebase Auth Server is running',
    endpoints: {
      signup: 'POST /signup',
      login: 'POST /login',
      profile: 'GET /profile (protected)'
    }
  })
})

export default app