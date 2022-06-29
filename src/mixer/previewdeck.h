#pragma once

#include "mixer/basetrackplayer.h"

class PreviewDeck : public BaseTrackPlayerImpl {
    Q_OBJECT
  public:
    PreviewDeck(PlayerManager* pParent,
            UserSettingsPointer pConfig,
            EngineMaster* pMixingEngine,
            EffectsManager* pEffectsManager,
            EngineChannel::ChannelOrientation defaultOrientation,
            const ChannelHandleAndGroup& handleGroup);
    ~PreviewDeck() override = default;
};
