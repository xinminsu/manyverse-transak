// SPDX-FileCopyrightText: 2021-2022 The Manyverse Authors
//
// SPDX-License-Identifier: MPL-2.0

import {h} from '@cycle/react';
import {Text, StyleSheet, View, ActivityIndicator} from 'react-native';
import {t} from '~frontend/drivers/localization';
import {Dimensions} from '~frontend/global-styles/dimens';
import {Palette} from '~frontend/global-styles/palette';
import {Typography} from '~frontend/global-styles/typography';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: Dimensions.horizontalSpaceBig * 2,
    marginTop: Dimensions.verticalSpaceHuge,
  },

  text: {
    marginTop: Dimensions.verticalSpaceNormal,
    marginBottom: Dimensions.verticalSpaceBig,
    color: Palette.textVeryWeak,
    fontSize: Typography.fontSizeBig,
    lineHeight: Typography.lineHeightBig,
    fontFamily: Typography.fontFamilyReadableText,
    fontWeight: 'bold',
  },
});

export default function Submitting() {
  return h(View, {style: styles.container}, [
    h(ActivityIndicator, {
      animating: true,
      size: Dimensions.iconSizeHuge,
      color: Palette.brandMain,
    }),
    h(Text, {style: styles.text}, [t('register_alias.submitting.title')]),
  ]);
}
