// SPDX-FileCopyrightText: 2018-2022 The Manyverse Authors
//
// SPDX-License-Identifier: MPL-2.0

import xs, {Stream} from 'xstream';
import {ReactElement} from 'react';
import {StateSource, Reducer} from '@cycle/state';
import {ReactSource} from '@cycle/react';
import {Platform} from 'react-native';
import {Command, NavSource} from 'cycle-native-navigation';
import {SharedContent} from 'cycle-native-share';
import {State as AppState} from '~frontend/drivers/appstate';
import {NetworkSource} from '~frontend/drivers/network';
import {SSBSource, Req} from '~frontend/drivers/ssb';
import {Command as AlertCommand, DialogSource} from '~frontend/drivers/dialogs';
import {
  Toast,
  Duration as ToastDuration,
  Duration,
} from '~frontend/drivers/toast';
import {t} from '~frontend/drivers/localization';
import {Props} from './props';
import view from './view';
import intent from './intent';
import model, {State} from './model';
import alert from './alert';
import ssb from './ssb';
import dialog from './dialog';
import navigation from './navigation';
import connDialogs from './connDialogs';

export interface Sources {
  props: Stream<Props>;
  screen: ReactSource;
  navigation: NavSource;
  appstate: Stream<AppState>;
  state: StateSource<State>;
  network: NetworkSource;
  ssb: SSBSource;
  dialog: DialogSource;
}

export interface Sinks {
  clipboard: Stream<string>;
  screen: Stream<ReactElement<any>>;
  navigation: Stream<Command>;
  dialog: Stream<AlertCommand>;
  state: Stream<Reducer<State>>;
  ssb: Stream<Req>;
  linking: Stream<string>;
  share: Stream<SharedContent>;
  toast: Stream<Toast>;
}

export function connectionsPanel(sources: Sources): Sinks {
  const connDialogActions = connDialogs(sources.dialog, sources.state.stream);
  const actions = intent(
    sources.screen,
    sources.navigation,
    sources.state.stream,
    connDialogActions.connDialog$,
  );
  const dialogActions = dialog(actions, sources.dialog);
  const actionsPlus = {...actions, ...dialogActions};
  const command$ = navigation(actionsPlus, sources.state.stream);
  const reducer$ = model(
    sources.props,
    actionsPlus,
    sources.ssb,
    sources.network,
    sources.appstate,
  );
  const ssb$ = ssb(actionsPlus);
  const alert$ = alert(actionsPlus, sources.state.stream);
  const vdom$ = view(sources.state.stream);

  const share$ = actionsPlus.shareRoomInvite$.map(({invite, room}) => ({
    title: t('connections.share_code.room.title'),
    message:
      t('connections.share_code.room.message', {name: room}) + '\n\n' + invite,
    dialogTitle: t('connections.share_code.room.dialog_note'),
  }));

  const clipboard$ =
    Platform.OS === 'web'
      ? share$.map((shareObj) => shareObj.message)
      : xs.never();

  const shareToast$ =
    Platform.OS === 'web'
      ? share$.mapTo({
          type: 'show',
          message: t('message.toast.copied_to_clipboard'),
          duration: Duration.SHORT,
        } as Toast)
      : xs.never();

  const inviteToast$: Stream<Toast> = sources.ssb.acceptInviteResponse$.map(
    (res) => {
      if (res === true)
        return {
          type: 'show' as 'show',
          flavor: 'success',
          message: t('connections.toasts.invite_accepted'),
          duration: ToastDuration.SHORT,
        } as Toast;
      else
        return {
          type: 'show' as 'show',
          flavor: 'failure',
          message: t('connections.toasts.invite_rejected'),
          duration: ToastDuration.LONG,
        } as Toast;
    },
  );

  const signInToRoom$ = dialogActions.confirmedSignInRoom$
    .map((roomId) => sources.ssb.produceSignInWebUrl$(roomId))
    .flatten();

  return {
    clipboard: clipboard$,
    dialog: alert$,
    navigation: command$,
    screen: vdom$,
    state: reducer$,
    ssb: ssb$,
    linking: signInToRoom$,
    share: Platform.OS === 'web' ? xs.never() : share$,
    toast: xs.merge(shareToast$, inviteToast$),
  };
}
