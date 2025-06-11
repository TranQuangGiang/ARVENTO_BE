import slugify from 'slugify';

const generateSlug = (text) => {
  if (!text) return '';
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'vi'
  });
};

export default generateSlug;
