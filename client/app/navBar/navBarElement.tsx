import React from "react";
import Link from "next/link";

interface NavBarElementProps {
  icon: React.ReactNode;
  navBarSection: string;
  additionalClass?: string;
}

class NavBarElement extends React.Component<NavBarElementProps> {
  constructor(props: NavBarElementProps) {
    super(props);
  }

  render() {
    const { icon, navBarSection, additionalClass } = this.props;
    const routes: { [key: string]: string } = {
      Home: "/",
      Create: "/input",
      Profile: "/profile",
      About: "/about",
    };

    return (
      <Link
        href={routes[navBarSection] || "/"}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          additionalClass === 'active'
            ? 'bg-purple-500/20 text-purple-400'
            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
        }`}
      >
        <div className="icon flex-shrink-0">{icon}</div>
        <p className="text-sm font-medium hidden sm:block">{navBarSection}</p>
      </Link>
    );
  }
}

export default NavBarElement;