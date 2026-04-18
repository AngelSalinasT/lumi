#ifndef AVATAR_UI_H
#define AVATAR_UI_H

#include <Avatar.h>

enum Expression {
  EXPR_NEUTRAL,
  EXPR_LISTENING,
  EXPR_THINKING,
  EXPR_TALKING,
  EXPR_SAD,
  EXPR_ALERT
};

void avatar_init(m5avatar::Avatar &avatar);
void avatar_set_expression(m5avatar::Avatar &avatar, Expression expr);

#endif
