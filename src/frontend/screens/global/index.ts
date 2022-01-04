// SPDX-FileCopyrightText: 2020-2022 The Manyverse Authors
//
// SPDX-License-Identifier: MPL-2.0

import xs, {Stream} from 'xstream';
import {Command} from 'cycle-native-navigation';
import {Reducer, StateSource} from '@cycle/state';
import {AsyncStorageSource} from 'cycle-native-asyncstorage';
import {GlobalEvent} from '../../drivers/eventbus';
import {Req, SSBSource} from '../../drivers/ssb';
import {Command as LocalizationCmd} from '../../drivers/localization';
import {FSSource} from '../../drivers/fs';
import {DialogSource} from '../../drivers/dialogs';
import {Toast} from '../../drivers/toast';
import model, {State} from './model';
import intent from './intent';
import navigation from './navigation';
import ssb from './ssb';
import localization from './localization';
import toast from './toast';

export interface Sources {
  state: StateSource<State>;
  ssb: SSBSource;
  fs: FSSource;
  globalEventBus: Stream<GlobalEvent>;
  linking: Stream<string>;
  asyncstorage: AsyncStorageSource;
  dialog: DialogSource;
}

export interface Sinks {
  state: Stream<Reducer<State>>;
  navigation: Stream<Command>;
  ssb: Stream<Req>;
  localization: Stream<LocalizationCmd>;
  toast: Stream<Toast>;
  globalEventBus: Stream<GlobalEvent>;
}

export function global(sources: Sources): Sinks {
  const state$ = sources.state.stream;
  const actions = intent(
    sources.globalEventBus,
    sources.linking,
    sources.dialog,
    sources.ssb,
    state$,
  );
  const cmd$ = navigation(actions, state$);
  const reducer$ = model(sources.ssb, sources.asyncstorage);
  const updateLocalization$ = localization(sources.fs);
  const req$ = ssb(updateLocalization$, actions);
  const toast$ = toast(actions, sources.ssb);

  /**
   * Hack to solve race conditions elsewhere (e.g. Welcome screen).
   * TODO: ideally there should be no synchronous race conditions between
   * the different sources/sinks managed by cycle-native-navigation
   */
  const hackLocalizationLoaded$ = updateLocalization$
    .map(() => xs.periodic(300).take(3))
    .flatten()
    .mapTo({type: 'localizationLoaded'} as GlobalEvent);

  const approveCheckingNewVersion$ = actions.approvedCheckingNewVersion$
    .take(1)
    .mapTo({type: 'approveCheckingNewVersion'} as GlobalEvent);

  const event$ = xs.merge(hackLocalizationLoaded$, approveCheckingNewVersion$);

  return {
    navigation: cmd$,
    state: reducer$,
    localization: updateLocalization$,
    ssb: req$,
    toast: toast$,
    globalEventBus: event$,
  };
}
