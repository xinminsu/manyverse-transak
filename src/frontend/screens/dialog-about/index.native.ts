// SPDX-FileCopyrightText: 2018-2022 The Manyverse Authors
//
// SPDX-License-Identifier: MPL-2.0

import xs, {Stream} from 'xstream';
import {Command, NavSource} from 'cycle-native-navigation';
import {ReactSource, h} from '@cycle/react';
import {ReactElement} from 'react';
import {StyleSheet} from 'react-native';
import {Options} from 'react-native-navigation';
import {t} from '~frontend/drivers/localization';
import MarkdownDialog from '~frontend/components/dialogs/MarkdownDialog';
import getContent from './content';

export type Sources = {
  screen: ReactSource;
  navigation: NavSource;
};

export type Sinks = {
  screen: Stream<ReactElement<any>>;
  navigation: Stream<Command>;
};

export const navOptions: Options = MarkdownDialog.navOptions;

export const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
});

export function dialogAbout(sources: Sources): Sinks {
  const vdom$ = xs.of(
    h(MarkdownDialog, {
      sel: 'dialog',
      title: t('dialog_about.title'),
      content: getContent(),
    }),
  );

  const command$ = xs
    .merge(
      sources.navigation.backPress(),
      sources.screen.select('dialog').events('close'),
    )
    .mapTo({type: 'dismissModal'} as Command);

  return {
    screen: vdom$,
    navigation: command$,
  };
}
