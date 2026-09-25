import React from 'react';
import { Composition, Folder } from 'remotion';
import './fonts';
import { LaunchVideo } from './LaunchVideo';
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
    <Composition id="LaunchVideo" component={LaunchVideo} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Folder name="Scenes">
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
