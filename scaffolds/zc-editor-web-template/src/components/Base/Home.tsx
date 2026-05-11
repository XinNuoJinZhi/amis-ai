import Avatar from "./avatar";
import logo from '@/assets/imgs/logo.png'
import { history } from '@umijs/max';
import { isEditorialEnd } from '@/utils/index'

const Home = {
    type: 'app',
    brandName: '',
    onBrandNameClick: () => {
        if (!isEditorialEnd()) {
            history.push('/app/')
        }
    },
    logo: logo,
    showBreadcrumbHomePath: false,
    showFullBreadcrumbPath: isEditorialEnd(),
    header: {
        type: "container",
        style: {
            width: "100%",
            display: "flex",
            "justify-content": "flex-end"
        },
        body: [
            Avatar
        ]
    },
    pages: []
}

export default Home;
