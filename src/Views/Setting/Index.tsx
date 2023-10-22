import { Box, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@rneui/base';
import React from 'react';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Animated, {
	BounceInDown,
	FlipInXUp,
	ReduceMotion
} from 'react-native-reanimated';
export default function () {
	const navigate = useNavigation<NativeStackNavigationProp<any, ''>>();
	const settingComponents: {
		text: string;
		icon: React.ReactNode;
		routeName: string;
	}[] = [
		{
			text: '分类',
			icon: <MaterialIcons size={25} name="category" />,
			routeName: 'Category'
		},
		{
			text: '标签',
			icon: <FontAwesome6Icon size={25} name="tags" />,
			routeName: 'Tag'
		},
		{
			text: '平摊',
			icon: <Octicons size={25} name="checklist" />,
			routeName: 'Balance'
		}
	];
	return (
		<>
			<Animated.View
				entering={BounceInDown.duration(500).reduceMotion(
					ReduceMotion.Never
				)}>
				<Card containerStyle={{ borderRadius: 12 }}>
					<Card.FeaturedSubtitle
						style={{
							color: 'black',
							fontSize: 16,
							fontWeight: 'bold'
						}}>
						功能
					</Card.FeaturedSubtitle>
					<Card.Divider />
					<Box
						flexDirection="row"
						flexWrap="wrap"
						gap={10}
						justifyContent="flex-start">
						{settingComponents.map(({ text, icon, routeName }) => (
							<Pressable
								minWidth={'22%'}
								onPress={() => navigate.push(routeName)}
								key={text}>
								<VStack alignItems="center">
									{icon}
									<Text>{text}</Text>
								</VStack>
							</Pressable>
						))}
					</Box>
				</Card>
			</Animated.View>
		</>
	);
}
