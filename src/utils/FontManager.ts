import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome6Pro from 'react-native-vector-icons/FontAwesome6Pro';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Zocial from 'react-native-vector-icons/Zocial';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

type FontKey =
	| 'AntDesign'
	| 'EvilIcons'
	| 'Entypo'
	| 'Feather'
	| 'FontAwesome'
	| 'FontAwesome5'
	| 'FontAwesome5Pro'
	| 'Fontisto'
	| 'Ionicons'
	| 'MaterialCommunityIcons'
	| 'MaterialIcons'
	| 'Octicons'
	| 'Zocial'
	| 'FontAwesome6'
	| 'FontAwesome6Pro'
	| 'SimpleLineIcons';
type FontMap = Record<FontKey, any>;

const fonts: FontMap = {
	AntDesign,
	Entypo,
	Feather,
	FontAwesome,
	FontAwesome5,
	FontAwesome5Pro,
	Fontisto,
	SimpleLineIcons,
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
	Octicons,
	Zocial,
	FontAwesome6,
	FontAwesome6Pro,
	EvilIcons
};

function getFontByFamily(family: FontKey): React.FC {
	return fonts[family];
}

export type { FontKey };
export { fonts };
export default getFontByFamily;
