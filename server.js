require('dotenv').config();
const express = require('express');
const { connectToDb } = require('./db.js');
const { installHandler } = require('./api_handler.js');
const { router: authRouter } = require('./auth.js');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((err, req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:8000");
  res.header("Access-Control-Allow-Credentials", "true");
  next(err);
});


app.use('/api', authRouter);

const corsOptions = {
  origin: 'http://localhost:8000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.options('/graphql', cors(corsOptions));
app.use('/graphql', cors(corsOptions));
installHandler(app);

const port = process.env.PORT || 3000;

(async function start() {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}()); 