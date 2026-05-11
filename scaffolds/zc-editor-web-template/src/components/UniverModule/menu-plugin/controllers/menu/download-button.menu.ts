import type { IMenuButtonItem } from '@univerjs/preset-sheets-core'
import { MenuItemType } from '@univerjs/preset-sheets-core'
import { DownloadButtonOperation } from '../../commands/download-button.operation'


export function CustomMenuItemDownloadButtonFactory(): IMenuButtonItem<string> {
  return {
    // Bind the command id, clicking the button will trigger this command
    id: DownloadButtonOperation.id,
    // The type of the menu item, in this case, it is a button
    type: MenuItemType.BUTTON,
    // The icon of the button, which needs to be registered in ComponentManager
    icon: 'DownloadButtonIcon',
    // The tooltip of the button. Prioritize matching internationalization. If no match is found, the original string will be displayed
    tooltip: 'customMenu.download',
    // The title of the button. Prioritize matching internationalization. If no match is found, the original string will be displayed
    title: 'customMenu.download',
  }
}