import { ComponentManager, ContextMenuGroup, ContextMenuPosition, IMenuManagerService, RibbonStartGroup } from '@univerjs/preset-sheets-core'
import { Disposable, ICommandService, Inject, Injector } from '@univerjs/presets'
import { DownloadButtonOperation } from '../commands/download-button.operation'
import { DownloadButtonIcon } from '../components/download-icon'
import { CustomMenuItemDownloadButtonFactory } from './menu/download-button.menu'

export class CustomMenuController extends Disposable {
  constructor(
    @Inject(Injector) private readonly _injector: Injector,
    @ICommandService private readonly _commandService: ICommandService,
    @IMenuManagerService private readonly _menuManagerService: IMenuManagerService,
    @Inject(ComponentManager) private readonly _componentManager: ComponentManager,
  ) {
    super()

    this._initCommands()
    this._registerComponents()
    this._initMenus()
  }

  /**
   * register commands
   */
  private _initCommands(): void {
    [
      DownloadButtonOperation
    ].forEach((c) => {
      this.disposeWithMe(this._commandService.registerCommand(c))
    })
  }

  /**
   * register icon components
   */
  private _registerComponents(): void {
    this.disposeWithMe(this._componentManager.register('DownloadButtonIcon', DownloadButtonIcon))
  }

  /**
   * register menu items
   */
  private _initMenus(): void {
    this._menuManagerService.mergeMenu({
      [RibbonStartGroup.OTHERS]: {
        [DownloadButtonOperation.id]: {
          order: 10,
          menuItemFactory: CustomMenuItemDownloadButtonFactory,
        }
      },
      [ContextMenuPosition.MAIN_AREA]: {
        [ContextMenuGroup.OTHERS]: {
          [DownloadButtonOperation.id]: {
            order: 10,
            menuItemFactory: CustomMenuItemDownloadButtonFactory,
          }
        },
      },
    })
  }
}
