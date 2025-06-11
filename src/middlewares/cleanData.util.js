import { generateSlug, baseResponse } from '../utils/index.js';
import { logger } from '../config/index.js'

const cleanDataMiddleware = (config) => {
  return (req, res, next) => {
    try {
      const data = req.body;
      logger.info('[CleanDataMiddleware] Raw input:', data);

      for (const [field, rules] of Object.entries(config)) {
        const value = data[field];

        if (value === undefined || value === null) continue;

        switch (rules.type) {
          case 'string':
            if (typeof value === 'string') {
              data[field] = value.trim();
              logger.info(`[CleanDataMiddleware] Trimmed string for field "${field}":`, data[field]);

              if (rules.slugify && !data[rules.slugField || 'slug']) {
                const slug = generateSlug(data[field]);
                data[rules.slugField || 'slug'] = slug;
                logger.info(`[CleanDataMiddleware] Generated slug for field "${field}":`, slug);
              }
            }
            break;

          case 'number':
            if (typeof value === 'string' && value.trim() !== '') {
              const parsed = rules.isFloat ? parseFloat(value) : parseInt(value, 10);
              if (!isNaN(parsed)) {
                data[field] = parsed;
                logger.info(`[CleanDataMiddleware] Parsed number for field "${field}":`, parsed);
              }
            }
            break;

          case 'array':
            if (typeof value === 'string') {
              const array = value.split(',').map(i => i.trim()).filter(Boolean);
              data[field] = array;
              logger.info(`[CleanDataMiddleware] Converted string to array for field "${field}":`, array);
            }
            break;

          case 'json':
            if (typeof value === 'string') {
              try {
                const json = JSON.parse(value);
                data[field] = json;
                logger.info(`[CleanDataMiddleware] Parsed JSON for field "${field}":`, json);
              } catch (err) {
                logger.error(`Error ${err}`);
                logger.warn(`[CleanDataMiddleware] Failed to parse JSON for field "${field}":`, value);
              }
            }
            break;

          default:
            logger.warn(`[CleanDataMiddleware] Unknown type "${rules.type}" for field "${field}"`);
            break;
        }
      }

      logger.info('[CleanDataMiddleware] Cleaned data:', data);
      req.body = data;
      next();
    } catch (error) {
      logger.error('[CleanDataMiddleware] Error:', error);
      return baseResponse.badRequestResponse(res, null, 'Invalid data');
    }
  };
}

export default cleanDataMiddleware;