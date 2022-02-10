// SPDX-FileCopyrightText: 2018-2022 The Manyverse Authors
//
// SPDX-License-Identifier: MPL-2.0

import xs, {Stream} from 'xstream';
import {Command} from 'cycle-native-navigation';
import {navOptions as secretInputNavOpts} from '~frontend/screens/secret-input';
import {Screens} from '~frontend/screens/enums';
import {navOptions as centralNavOpts} from '~frontend/screens/central';
import {navOptions as migratingNavOpts} from '~frontend/screens/migrating/layout';

export interface Actions {
  createAccount$: Stream<any>;
  restoreAccount$: Stream<any>;
  migrateAccount$: Stream<any>;
  skipOrNot$: Stream<boolean>;
}

export default function navigation(actions: Actions): Stream<Command> {
  const skipWelcome$ = actions.skipOrNot$.filter((skip) => skip === true);

  const goToCentral$ = xs.merge(actions.createAccount$, skipWelcome$).mapTo({
    type: 'setStackRoot',
    layout: {
      sideMenu: {
        left: {
          component: {name: Screens.Drawer},
        },
        center: {
          stack: {
            id: 'mainstack',
            children: [
              {
                component: {
                  name: Screens.Central,
                  options: centralNavOpts,
                },
              },
            ],
          },
        },
      },
    },
  } as Command);

  const goToMigrating$ = actions.migrateAccount$.mapTo({
    type: 'push',
    layout: {
      component: {
        name: Screens.Migrating,
        options: migratingNavOpts,
      },
    },
  } as Command);

  const goToSecretInput$ = actions.restoreAccount$.mapTo({
    type: 'push',
    layout: {
      component: {
        name: Screens.SecretInput,
        passProps: {
          practiceMode: false,
        },
        options: secretInputNavOpts,
      },
    },
  } as Command);

  return xs.merge(goToCentral$, goToMigrating$, goToSecretInput$);
}
