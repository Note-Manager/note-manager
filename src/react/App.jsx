import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {TabManager} from "./components/TabManager.jsx";

const root = createRoot(document.getElementById("root"));

root.render(
    <TabManager/>
);