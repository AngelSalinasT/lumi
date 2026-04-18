#include "avatar_ui.h"
#include <M5Stack.h>

using namespace m5avatar;

void avatar_init(Avatar &avatar) {
  avatar.init();
  avatar.setExpression(Expression::Neutral);
  avatar.setSpeechText("");
}

void avatar_set_expression(Avatar &avatar, ::Expression expr) {
  switch (expr) {
    case EXPR_NEUTRAL:
      avatar.setExpression(m5avatar::Expression::Neutral);
      avatar.setSpeechText("");
      break;

    case EXPR_LISTENING:
      avatar.setExpression(m5avatar::Expression::Happy);
      avatar.setSpeechText("Escuchando...");
      break;

    case EXPR_THINKING:
      avatar.setExpression(m5avatar::Expression::Doubt);
      avatar.setSpeechText("Pensando...");
      break;

    case EXPR_TALKING:
      avatar.setExpression(m5avatar::Expression::Happy);
      avatar.setSpeechText("");
      // La boca se mueve automáticamente con avatar.setSpeechText
      break;

    case EXPR_SAD:
      avatar.setExpression(m5avatar::Expression::Sad);
      avatar.setSpeechText("Error...");
      break;

    case EXPR_ALERT:
      avatar.setExpression(m5avatar::Expression::Angry);
      avatar.setSpeechText("EMERGENCIA!");
      break;
  }
}
