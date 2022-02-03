export default function Icon(props) {
    let icon;

    switch (props.name) {
        case 'chevron-up':
            icon = <ChevronUp />;
            break;
        case 'chevron-down':
            icon = <ChevronDown />;
            break;
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={"rjf-icon rjf-icon-" + props.name} viewBox="0 0 16 16">
            {icon}
        </svg>
    );
}

function ChevronUp(props) {
    return (
        <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
    );
}

function ChevronDown(props) {
    return (
        <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    );
}
