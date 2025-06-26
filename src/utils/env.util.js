
const  getEnv = (key, required = true) => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const  getEnvInt = (key, required = true)  => {
  const value = getEnv(key, required);
  const intValue = parseInt(value, 10);
  if (isNaN(intValue)) {
    throw new Error(`Environment variable ${key} must be an integer`);
  }
  return intValue;
}

const  getEnvBool = (key, required = true) => {
  const value = getEnv(key, required);
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new Error(`Environment variable ${key} must be boolean (true/false or 1/0)`);
}

const  getEnvWithDefault = (key, defaultValue) => {
  return process.env[key] || defaultValue;
}

export default  {
  getEnv,
  getEnvInt,
  getEnvBool,
  getEnvWithDefault,
};
