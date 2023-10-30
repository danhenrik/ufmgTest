const router = require('express').Router();
const {unlink} = require('fs').promises;
const path = require('path');
const UserService = require('../services/UserService');
const SendMailService = require('../services/SendMailService');
const blacklist = require('../../redis/blacklist');
const passwordToken = require('../../redis/password-token');
const {loginMiddleware,
  jwtMiddleware,
  checkRole,
  notLoggedIn} = require('../../middlewares/auth-middlewares');
const {userValidate} = require('../../middlewares/user-validators');
const {upload} = require('../../middlewares/multer');
const InvalidRouteError = require('../../errors/InvalidRouteError');
const PermissionError = require('../../errors/PermissionError');
const {requestFilter} = require('../../middlewares/object-filter');

/**
 * Realiza o login através do midlleware do Passport
 */
router.post('/login', notLoggedIn(), userValidate('login'), loginMiddleware);

/**
 * Envia o JWT atual para a blacklist para que ele não seja mais válido.
 */
router.get('/logout',
  jwtMiddleware,
  async (req, res, next) => {
    try {
      const token = req.cookies['jwt'];
      await blacklist.addToken(token);

      req.logout();
      res.clearCookie('jwt');
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Ver dados de todos os usuários, pega as opções
 * de ordenação, página e número de consultas do body.
 */
router.get('/',
  jwtMiddleware,
  requestFilter('query', ['page', 'order', 'orderBy', 'perPage']),
  async (req, res, next) => {
    try {
      const options = req.query;
      const usersAndCount = await UserService.getAllUsersByPage(options);
      res.status(200).json(usersAndCount);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Criação de usuário, verifica todos os campos necessários
 * para a criação de um usuário e envia para o banco.
 */
router.post('/',
  jwtMiddleware,
  checkRole('admin'),
  upload('new'),
  userValidate('createUser'),
  async (req, res, next) => {
    try {
      const user = {
        name: req.body.name,
        email: req.body.email,
        personalEmail: req.body.personalEmail,
        password: req.body.password,
        image: req.file ? req.file.filename : 'default-user-icon.jpg',
        role: req.body.role,
      };

      await UserService.createUser(user);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Página de usuário, envia as informações do usuário atual para o front.
 */
router.get('/user',
  jwtMiddleware,
  async (req, res, next) => {
    try {
      if (req.user) {
        const user = await UserService.getCurrentUser(req.user.id);
        res.status(200).json(user);
      }
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Editar informções de usuário, recebe e verifica as informações no body
 * para atualizar no banco de dados.
 * Falta realizar a verificação de que os dados forma alterados.
 */
router.put('/user',
  jwtMiddleware,
  upload('userUpdate'),
  requestFilter('body', ['name', 'email', 'personalEmail']),
  userValidate('updateUser'),
  async (req, res, next) => {
    try {
      req.body.image = req.file ? req.file.filename : undefined;
      await UserService.updateUserInfo(req.user.id, req.body);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Recebe o id de um usuário qualquer nos parâmetros,
 * retorna o usuário com esse id.
 */
router.get('/user/:id',
  jwtMiddleware,
  checkRole('admin'),
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const user = await UserService.getUserById(userId);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Editar informações de um usuário a partir de seu ID. Essa rota é única para
 * admins e não deve ser usada para alterar as informações do usuário logado.
 * Implementação muito parecida com a PUT /users/user
 */
router.put('/user/:id',
  jwtMiddleware,
  checkRole('admin'),
  upload('adminUpdate'),
  userValidate('updateUser'),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      // O comparador utilizado foi '==' por motivos de conversão de tipos
      if (id == req.user.id) {
        if (req.file) {
          await unlink(path.resolve(__dirname,
            '../../../react-app/public/upload', req.file.filename));
        }

        throw new InvalidRouteError('Utilize a rota PUT /users/user' +
          ' para atualizar as próprias informações!');
      }

      req.body.image = req.file ? req.file.filename : undefined;
      await UserService.updateUserInfo(id, req.body);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Editar senha, similar ao editar as outras informações,
 * mas também realiza criptografia da senha.
 */
router.put('/password',
  jwtMiddleware,
  userValidate('updatePassword'),
  async (req, res, next) => {
    try {
      await UserService.updateUserPassword(req.user.id, req.body);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

router.post('/forgotPassword',
  notLoggedIn('Você não pode usar a funcionalidade de Esqueci Minha Senha ' +
    'estando logado!'),
  userValidate('forgotPassword'),
  async (req, res, next) => {
    try {
      const user = await UserService.getUserByEmail(req.body.email);
      if (user) {
        const mailInfo = {
          receiver: user.email,
          sender: '"Sistema iJunior 👻" <ijunior@ijunior.com.br>',
          subject: 'Redefinição de Senha',
        };

        mailInfo.path = await path
          .resolve(__dirname, '..', 'views', 'email.html');

        const token = await passwordToken.generateToken(user.email);

        const viewVariables = {
          HOST_URL: process.env.HOST_URL,
          token,
        };

        await SendMailService.send(mailInfo, viewVariables);
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

router.post('/resetPassword',
  notLoggedIn('Você não pode usar a funcionalidade de Esqueci Minha Senha ' +
    'estando logado!'),
  userValidate('resetPassword'),
  async (req, res, next) => {
    try {
      const token = req.body.token;
      const password = req.body.password;

      await UserService.resetPassword(token, password);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

router.put('/deactivate',
  jwtMiddleware,
  checkRole('admin'),
  async (req, res, next) => {
    try {
      const email = req.body.email;
      console.log(email);
      if (email === req.user.email) {
        throw new PermissionError('Você não pode desativar a si mesmo!');
      }

      await UserService.deactivateUser(email);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

router.put('/activate',
  jwtMiddleware,
  checkRole('admin'),
  async (req, res, next) => {
    try {
      const email = req.body.email;
      if (email === req.user.email) {
        throw new PermissionError('Você não pode ativar a si mesmo!');
      }

      await UserService.activateUser(email);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
