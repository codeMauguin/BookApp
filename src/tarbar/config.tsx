import React from 'react';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import ElIcon from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import getFontByFamily from 'utils/FontManager';
import { Icon as I } from '@gluestack-ui/themed';
/**
 /**
 * 编写底部的
 */
export const IconMap: Record<
	string,
	( color: string, size: number ) => React.JSX.Element
> = {
	首页: ( color: string, size: number ): React.JSX.Element => (
		<Icon name="home" color={ color } size={ size } />
	),
	记一笔: ( color: string, size: number ): React.JSX.Element => (
		<ElIcon name="pencil" color={ color } size={ size } />
	),
	账户: ( color: string, size: number ): React.JSX.Element => (
		<Icon name="user" color={ color } size={ size } />
	),
	设置: ( color: string, size: number ): React.JSX.Element => (
		<I
			name="settings"
			as={ getFontByFamily( 'Feather' ) }
			color={ color }
			size={ size + 1 }
		/>
	),
	报表: ( color: string, size: number ): React.JSX.Element => (
		<Ionicons name="stats-chart" color={ color } size={ size } />
	),
	测试: () => <Text>测试</Text>
};
