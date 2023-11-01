const {body} = require('express-validator');
const {validate} = require('./validate');

const getValidations = (method) => {
  switch (method) {
  case 'login': {
    return [
      body('password')
        .exists()
        .withMessage('O campo de senha deve estar preenchido')
        .notEmpty()
        .withMessage('O campo de senha não pode ficar vazio!'),
      body('email')
        .exists()
        .withMessage('O campo de email deve estar preenchido!')
        .isEmail()
        .withMessage('O email inserido não é válido'),
    ];
  };
  case 'createUser': {
    return [
      body('name')
        .exists()
        .withMessage('O campo de nome deve estar preenchido!')
        .isAlpha('pt-BR', {ignore: ' '})
        .withMessage('Seu nome só pode conter letras!'),
      body('email')
        .exists()
        .withMessage('O campo de email deve estar preenchido!')
        .isEmail()
        .withMessage('O email profissional inserido não é válido'),
      body('personalEmail')
        .optional()
        .isEmail()
        .withMessage('O email pessoal inserido não é válido'),
      body('password')
        .exists()
        .withMessage('Insira uma senha!')
        .isStrongPassword()
        .withMessage('Sua senha deve conter pelo menos 8 caracteres, com pelo '+
        'menos um número, uma letra maiúscula e um caractér especial'),
      body('role', 'Selecione um papel')
        .exists()
        .withMessage('Selecione um papel para o usuário!')
        .isIn(['admin', 'user'])
        .withMessage('Selecione um papel válido para o usuário.'),
    ];
  };
  case 'updateUser': {
    return [
      body('name')
        .optional()
        .isAlpha('pt-BR', {ignore: ' '})
        .withMessage('Seu nome só pode conter letras!'),
      body('email')
        .optional()
        .isEmail()
        .withMessage('O email profissional inserido não é válido'),
      body('personalEmail')
        .optional()
        .if((value, {req}) => {
          // Se o usuário não tem um email pessoal cadastrado,
          // o React envia a string 'null'
          const hasPersonalEmail = req.body.personalEmail !== 'null';
          if (!hasPersonalEmail) {
            delete req.body['personalEmail'];
          }

          return hasPersonalEmail;
        })
        .isEmail()
        .withMessage('O email pessoal inserido não é válido'),
    ];
  };
  case 'updatePassword': {
    return [
      body('currentPassword')
        .exists()
        .withMessage('Insira sua senha antiga!'),
      body('newPassword')
        .exists()
        .withMessage('Insira uma senha nova!')
        .isStrongPassword()
        .withMessage('Sua senha deve conter pelo menos 8 caracteres, com pelo '+
        'menos um número, uma letra maiúscula e um caractér especial'),
    ];
  };
  case 'forgotPassword': {
    return [
      body('email')
        .exists()
        .isEmail()
        .withMessage('Insira um email válido'),
    ];
  };
  case 'resetPassword': {
    return [
      body('newPassword')
        .exists()
        .withMessage('Insira uma senha nova!')
        .isStrongPassword()
        .withMessage('Sua senha deve conter pelo menos 8 caracteres, com pelo '+
        'menos um número, uma letra maiúscula e um caractér especial'),
      body('token')
        .exists()
        .withMessage('Insira o token de reset!')
        .isHexadecimal()
        .withMessage('O token deve ser um hexadecimal!'),
    ];
  }
  }
};

module.exports = {userValidate: (method) => validate(getValidations(method))};
