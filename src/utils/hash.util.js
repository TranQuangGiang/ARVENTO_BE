import  bcrypt from 'bcrypt'

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (input, hashed) => {
  return await bcrypt.compare(input, hashed);
};

export default {
  hashPassword,
  comparePassword
}