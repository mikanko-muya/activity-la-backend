import { BadRequestError } from "../utils/errors/index.js";
import { LANGUAGES } from "../utils/localize.js";

// `?lang=lo` or `?lang=en` asks for one language: sendSuccess then folds every
// translated pair into it (see utils/localize.js). Without it a response
// carries both languages, which is what the admin forms edit.
//
// Read here, before the route's own validation replaces req.query with only
// the fields its schema knows.
export const readLanguage = (req, res, next) => {
    const lang = req.query?.lang;
    if (lang === undefined) return next();
    if (!LANGUAGES.includes(lang)) {
        return next(new BadRequestError(`lang must be one of: ${LANGUAGES.join(", ")}`));
    }
    req.lang = lang;
    next();
};
