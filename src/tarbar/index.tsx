import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TarBar } from './type';
import React from 'react';
import { Animated, View } from 'react-native';
import { isNull } from 'utils/types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { IconMap } from './config';
import { Divider, TabView, Text } from '@rneui/themed';
const Tab = createBottomTabNavigator();
import { Tab as TabButton } from '@rneui/themed';
const CustomTabBar: React.FC<any> = ( { state, descriptors, navigation } ) => {
	function onPress ( index: number ) {
		const route = state.routes[ index ];
		const { options } = descriptors[ route.key ];
		const { navigate = null } = options;
		if ( !isNull( navigate ) ) {
			navigation.navigate( navigate );
			return;
		}

		const event = navigation.emit( {
			type: 'tabPress',
			target: route.key
		} );

		if ( !event.defaultPrevented ) {
			navigation.navigate( route.name );
		}
	}
	return (
		<>
			<Divider />
			<TabButton
				disableIndicator={ true }
				value={ state.index }
				onChange={ onPress }
				indicatorStyle={ {
					backgroundColor: 'white',
					height: 0,
				} }
				variant="default"
			>

				{
					state.routes.map( ( route: any, index: number ) => {
						const { options } = descriptors[ route.key ];
						const iconSize = options.tabBarIconSize || 24; // 获取图标大小，默认为 24
						return <TabButton.Item
							key={ route.key }
							titleStyle={ { fontSize: 12 } }
							icon={ options.tabBarIcon( {
								color:
									state.index === index
										? options.tabBarActiveTintColor
										: options.tabBarInactiveTintColor,
								size: iconSize
							} ) }
						/>;
					} )
				}

			</TabButton >
		</>
	);
};

function view ( options: Array<TarBar> ): JSX.Element {
	return (
		<Tab.Navigator
			key="Tab"
			tabBar={ CustomTabBar }
			screenOptions={ ( { route } ) => ( {
				tabBarIcon: ( { color, size } ) => {
					return IconMap[ route.name ]( color, size );
				},
				tabBarActiveTintColor: 'tomato',
				tabBarInactiveTintColor: 'gray',
				headerShown: false
			} ) }
		>
			{ options.map(
				( item: TarBar, index ): JSX.Element => {
					return (
						<Tab.Screen
							key={ item.title }
							name={ item.title }
							initialParams={ {
								index: index
							} }
							component={
								item.component ??
								( () => <View key={ item.title }></View> )
							}
							options={ item.options }
						/>
					);
				}
			) }
		</Tab.Navigator>
	);
}

export default view;
