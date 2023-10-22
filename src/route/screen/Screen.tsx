import React from 'react';

function Screen(props: {
  children: React.JSX.Element | React.JSX.Element[] | null;
}): React.JSX.Element {
  const {children} = props;
  return <>{children}</>;
}

export default Screen;
