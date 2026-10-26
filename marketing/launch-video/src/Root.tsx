import React from 'react';
import { Composition, Folder } from 'remotion';
import './fonts';
import { AdVideo } from './ad/AdVideo';
import { ArVideo } from './ar/ArVideo';
import { ChatAr, FinaleAr, GlanceAr, InvoiceAr, NoResultAr, SearchAr } from './ar/scenes';
import { FPS as FPS_AR, SCENES_AR, TOTAL_AR } from './ar/timing';
import { CreateAd, FinaleAd, HookAd, PayAd, SignAd } from './ad/scenes';
import { FPS as FPS_AD, SCENES_AD, TOTAL_AD } from './ad/timing';
import { LaunchVideo } from './LaunchVideo';
import { ProsVideo } from './pros/ProsVideo';
import { ReelVideo } from './reel/ReelVideo';
import { FPS as FPS_REEL, TOTAL_REEL } from './reel/timing';
import { FPS as FPS_PROS, TOTAL as TOTAL_PROS } from './pros/timing';
import { LaunchVideoV2 } from './v2/LaunchVideoV2';
import { BentoV2 } from './v2/scenes/BentoV2';
import { ContactsV2 } from './v2/scenes/ContactsV2';
import { CreateV2 } from './v2/scenes/CreateV2';
import { FinaleV2 } from './v2/scenes/FinaleV2';
import { HookV2 } from './v2/scenes/HookV2';
import { IntroV2 } from './v2/scenes/IntroV2';
import { NightV2 } from './v2/scenes/NightV2';
import { PaidV2 } from './v2/scenes/PaidV2';
import { PayV2 } from './v2/scenes/PayV2';
import { SignV2 } from './v2/scenes/SignV2';
import { FPS as FPS_V2, SCENES_V2, TOTAL_V2 } from './v2/timing';
import { CreateScene } from './scenes/CreateScene';
import { HookScene } from './scenes/HookScene';
import { LockupScene } from './scenes/LockupScene';
import { LogoScene } from './scenes/LogoScene';
import { MontageScene } from './scenes/MontageScene';
import { PaidScene } from './scenes/PaidScene';
import { ShareScene } from './scenes/ShareScene';
import { SignScene } from './scenes/SignScene';
import { SummaryScene } from './scenes/SummaryScene';
import { FPS, SCENES, TOTAL_FRAMES } from './timing';

const W = 1080;
const H = 1920;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LaunchVideo" component={LaunchVideoV2} width={W} height={H} fps={FPS_V2} durationInFrames={TOTAL_V2} />
    <Folder name="v2-Scenes">
      <Composition id="HookV2" component={HookV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.hook} />
      <Composition id="IntroV2" component={IntroV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.intro} />
      <Composition id="CreateV2" component={CreateV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.create} />
      <Composition id="ContactsV2" component={ContactsV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.contacts} />
      <Composition id="SignV2" component={SignV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.sign} />
      <Composition id="PayV2" component={PayV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.pay} />
      <Composition id="PaidV2" component={PaidV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.paid} />
      <Composition id="BentoV2" component={BentoV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.bento} />
      <Composition id="NightV2" component={NightV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.night} />
      <Composition id="FinaleV2" component={FinaleV2} width={W} height={H} fps={FPS_V2} durationInFrames={SCENES_V2.finale} />
    </Folder>
    <Composition id="Reel20" component={ReelVideo} width={W} height={H} fps={FPS_REEL} durationInFrames={TOTAL_REEL} />
    <Composition id="Pros" component={ProsVideo} width={W} height={H} fps={FPS_PROS} durationInFrames={TOTAL_PROS} />
    <Composition id="ProsVoiceOnly" component={ProsVideo} width={W} height={H} fps={FPS_PROS} durationInFrames={TOTAL_PROS} defaultProps={{ music: false }} />
    <Composition id="Ad15" component={AdVideo} width={W} height={H} fps={FPS_AD} durationInFrames={TOTAL_AD} />
    <Folder name="Ad-Scenes">
      <Composition id="HookAd" component={HookAd} width={W} height={H} fps={FPS_AD} durationInFrames={SCENES_AD.hook} />
      <Composition id="CreateAd" component={CreateAd} width={W} height={H} fps={FPS_AD} durationInFrames={SCENES_AD.create} />
      <Composition id="SignAd" component={SignAd} width={W} height={H} fps={FPS_AD} durationInFrames={SCENES_AD.sign} />
      <Composition id="PayAd" component={PayAd} width={W} height={H} fps={FPS_AD} durationInFrames={SCENES_AD.pay} />
      <Composition id="FinaleAd" component={FinaleAd} width={W} height={H} fps={FPS_AD} durationInFrames={SCENES_AD.finale} />
    </Folder>
    <Composition id="AdAr" component={ArVideo} width={W} height={H} fps={FPS_AR} durationInFrames={TOTAL_AR} />
    <Folder name="Ar-Scenes">
      <Composition id="ChatAr" component={ChatAr} width={W} height={H} fps={FPS_AR} durationInFrames={SCENES_AR.chat} />
      <Composition id="SearchAr" component={SearchAr} width={W} height={H} fps={FPS_AR} durationInFrames={SCENES_AR.search} />
      <Composition id="NoResultAr" component={NoResultAr} width={W} height={H} fps={FPS_AR} durationInFrames={SCENES_AR.noresult} />
      <Composition id="InvoiceAr" component={InvoiceAr} width={W} height={H} fps={FPS_AR} durationInFrames={SCENES_AR.invoice} />
      <Composition id="GlanceAr" component={GlanceAr} width={W} height={H} fps={FPS_AR} durationInFrames={SCENES_AR.glance} />
      <Composition id="FinaleAr" component={FinaleAr} width={W} height={H} fps={FPS_AR} durationInFrames={SCENES_AR.finale} />
    </Folder>
    <Composition id="LaunchVideoV1" component={LaunchVideo} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Folder name="v1-Scenes">
      <Composition id="Hook" component={HookScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.hook} />
      <Composition id="Logo" component={LogoScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.logo} />
      <Composition id="Summary" component={SummaryScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.summary} />
      <Composition id="Create" component={CreateScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.create} />
      <Composition id="Sign" component={SignScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.sign} />
      <Composition id="Share" component={ShareScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.share} />
      <Composition id="Paid" component={PaidScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.paid} />
      <Composition id="Montage" component={MontageScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.montage} />
      <Composition id="Lockup" component={LockupScene} width={W} height={H} fps={FPS} durationInFrames={SCENES.lockup} />
    </Folder>
  </>
);
