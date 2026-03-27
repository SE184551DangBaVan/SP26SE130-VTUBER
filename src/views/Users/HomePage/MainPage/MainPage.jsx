import SideBar from '../../../../components/SideBar/SideBar'
import './MainPage.css'

export default function MainPage() {
  return (
    <div className='page-main-content'>
      <SideBar />
      <div className='page-main-content-container'>
        <div className='page-main-content-container-inner'>
          <div className='discord-ui-container'>
            <ul id='server-list-container'>
              <li className='serever__icon'></li>
              <li className='serever__icon'></li>
              <li className='serever__icon'></li>
              <li className='serever__icon'></li>
              <li className='serever__icon'></li>
              <li className='serever__icon'></li>
            </ul>
            <div className='messaging-function__container'>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
