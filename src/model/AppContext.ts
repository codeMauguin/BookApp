import React from 'react';
import { QuickSQLiteConnection } from 'react-native-quick-sqlite';

type AppContextProps = {
	isFinish: boolean;
	current: string;
	categoryIds: string[];
	db: QuickSQLiteConnection;
	accountIds: number[];
	tags: number[];
};
const AppContext = React.createContext<AppContextProps>(Object.create(null));
/**
 * Retrieves the current value of the AppContext using React's useContext hook.
 *
 * @return {AppContext} The current value of the AppContext.
 */
function useApp(): AppContextProps {
	return React.useContext(AppContext);
}
export { useApp, AppContext };
export type { AppContextProps };

type AppContextUpdateProps = {
	tags: React.Dispatch<React.SetStateAction<number[]>>;
	categoryIds: React.Dispatch<React.SetStateAction<string[]>>;
	accountIds: React.Dispatch<React.SetStateAction<number[]>>;
	current: React.Dispatch<React.SetStateAction<string>>;
};
const AppContextUpdate = React.createContext<AppContextUpdateProps>(
	Object.create(null)
);

export { AppContextUpdate };
export type { AppContextUpdateProps };

function useAppUpdate(): AppContextUpdateProps {
	return React.useContext(AppContextUpdate);
}
export { useAppUpdate };
