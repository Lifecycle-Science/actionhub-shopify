/*
  This file interacts with the app's database and is used by the app's REST APIs.
*/

import shopify from "./shopify.js";
import { Client } from 'pg'

const client = new Client({
  user: process.env.AWS_AURORA_DB_USERNAME,
  host: process.env.AWS_AURORA_DB_HOST,
  database: process.env.AWS_AURORA_DB_DATABASE,
  password: process.env.AWS_AURORA_DB_PASSWORD,
  port: 5432,
});

await client.connect();

const result = await client.query('SELECT * FROM my_table');
console.log(result.rows);

await client.end();
