import './ProfileBanner.css'

export default function ProfileBanner() {
  return (
    <div>
      <div id="profile-banner">
        <div id="profile-banner-header">
        </div>
        <div id="profile-banner-content">
        <img id="profile-banner-pfp" src="https://avatars.githubusercontent.com/u/71274141?v=4" width="100"/>
        <div id="profile-banner-status-dnd"></div>
        <div id="profile-banner-badges">
            <img data-tooltip="HypeSquad Bravery" id="profile-banner-badge" src="https://static.wikia.nocookie.net/discord/images/b/b5/Bravery.png" />
        </div>

        <div id="profile-banner-user-info">
            <h4 id="profile-banner-username">
            Pot-8-O's<span id="profile-banner-descrim">#tag</span>
            </h4>
            <p id="profile-banner-user-status">kartoshka_kartoffel • Potato/谢因工人</p>
            <p id="profile-banner-label-content">
            Am i the world's crispiest fries?<br/>
            Let's find out:<br/><br/>
            - <a href="https://youtu.be/9mST-VPfeyU?si=vn1sWEEr8QifYcET">https://youtu.be/9mST-VPfeyU?si=vn1sWEEr8QifYcET</a><br/>
            </p>
            <h4 id="profile-banner-label-note">note (only visible to you)</h4>
            <textarea placeholder="Click to add a note" id="profile-banner-note-content" type="text" onkeypress="this.value = this.value.substring(0,256);"></textarea>
        </div>
        </div>
    </div>
    </div>
  )
}
