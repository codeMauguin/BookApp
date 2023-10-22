import { Icon } from '@gluestack-ui/themed';
import { Image } from '@rneui/themed';
import React from 'react';
import { Icon as IconType } from 'types/entity';
import getFontByFamily, { FontKey } from 'utils/FontManager';

export default React.memo(
	function (props: IconType) {
		return (
			<>
				{props.type === 'icon' ? (
					<Icon
						as={getFontByFamily(props.family as FontKey)}
						name={props.name}
						size={props.size ?? 20}
						color={props.color}
					/>
				) : (
					<Image
						source={{ uri: props.name }}
						style={{
							width: props.size ?? 20,
							height: props.size ?? 20
						}}
						transition={true}
					/>
				)}
			</>
		);
	},
	(old, next) => old.id === next.id
);
