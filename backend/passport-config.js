const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const logger = require('./logger');

function initialize(passport, getUserByName, getUserById){
    const authenticateUser = async (name, password, done) => {
        const user = getUserByName(name)
        if (user == null) {
            logger.info("Here1")
          return done(null, false, { message: 'No user with that username' })
        }
    
        try {
          if (await bcrypt.compare(password, user.password)) {
            logger.info("Here2")
            logger.info(user.password)
            return done(null, user)
          } else {
            logger.info("Here3")
            return done(null, false, { message: 'Password incorrect' })
          }
        } catch (e) {
          return done(e)
        }
    }
    passport.use(new LocalStrategy({usernameField: 'name'}, authenticateUser))
     passport.serializeUser((user,done) => {
        logger.info("here5")
        logger.info(user.name)
        return done(null, user.id)
    })
     passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
     })
    
}
module.exports = initialize