import {
	Toast,
	VStack,
	ToastTitle,
	ToastDescription
} from '@gluestack-ui/themed';
import { notNull, throttle } from 'utils/types';

type ToastProps = {
	title?: string;
	description?: string;
	action: 'success' | 'error' | 'warning' | 'info' | 'attention';
	duration?: number;
	variant?: 'solid' | 'outline' | 'accent';
};

function showToast(
	toast: {
		show: (
			props: import('@gluestack-ui/toast/lib/typescript/types').InterfaceToastProps
		) => any;
		close: (id: any) => void;
		closeAll: () => void;
		isActive: (id: any) => boolean;
	},
	props: ToastProps
) {
	toast.show({
		duration: props.duration,
		avoidKeyboard: true,
		render: ({ id }) => (
			<Toast nativeID={id} action={props.action} variant={props.variant}>
				<VStack space="xs">
					{notNull(props.title) && (
						<ToastTitle>{props.title}</ToastTitle>
					)}
					{notNull(props.description) && (
						<ToastDescription>{props.description}</ToastDescription>
					)}
				</VStack>
			</Toast>
		)
	});
}

export { showToast };
