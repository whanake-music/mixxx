/***************************************************************************
                          midiobject.h  -  description
                             -------------------
    copyright            : (C) 2002 by Tue and Ken Haste Andersen
    email                :
 ***************************************************************************/

/***************************************************************************
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 ***************************************************************************/

#ifndef MIDIOBJECT_H
#define MIDIOBJECT_H

#include <Q3PtrVector>
#include <QtCore>
#include "defs.h"
#include "configobject.h"

#ifdef __SCRIPT__
class MidiScriptEngine;     // Forward declaration
#endif

class ControlObject;
class QWidget;
class DlgPrefMidiBindings;
class DlgPrefMidiDevice;

// These enums are used in the decoding of the status message into voice categories
typedef enum {
    NOTE_OFF         = 0x80,
    NOTE_ON          = 0x90,
    AFTERTOUCH       = 0xA0,
    CTRL_CHANGE      = 0xB0,
    PROG_CHANGE      = 0xC0,
    CHANNEL_PRESSURE = 0xD0,
    PITCH_WHEEL      = 0xE0
} MidiCategory;


class MidiObject : public QThread
{
                Q_OBJECT

public:
    MidiObject();
    ~MidiObject();
    void setMidiConfig(ConfigObject<ConfigValueMidi> *pMidiConfig);
    void reopen(QString device);
    virtual void devOpen(QString) = 0;
        virtual void updateDeviceList() {};
    virtual void devClose(QString) = 0;
    void add(ControlObject* c);
    void remove(ControlObject* c);
    /** Returns a list of available devices */
    virtual QStringList *getDeviceList();
    /** Returns the name of the current open device */
    QStringList getOpenDevices();
    /** Returns a list of available configurations. Takes as input the directory path
      * containing the configuration files */
    QStringList *getConfigList(QString path);

    // Stuff for sending messages to control leds etc
    void sendShortMsg(unsigned char status, unsigned char byte1, unsigned char byte2, QString device);
    virtual void sendShortMsg(unsigned int word);
    virtual void sendSysexMsg(unsigned char data[], unsigned int length);

    // Rx/Tx Toggle Functions
    bool getRxStatus(QString device);
    bool getTxStatus(QString device);
    void setRxStatus(QString device, bool status);
    void setTxStatus(QString device, bool status);
    bool getDebugStatus();
    void enableDebug(DlgPrefMidiDevice *dlgDevice);
    void disableDebug();

    bool getMidiLearnStatus();
    void enableMidiLearn(DlgPrefMidiBindings *dlgBindings);
    void disableMidiLearn();

#ifdef __SCRIPT__
    MidiScriptEngine *getMidiScriptEngine();
#endif

    signals:
    void midiEvent(ConfigValueMidi *value, QString device);
    void debugInfo(ConfigValueMidi *event, QString device);

protected:
    void run() {};
    void stop();
    void receive(MidiCategory category, char channel, char control, char value, QString device);

    bool requestStop, debug, midiLearn;
    QHash<QString, bool> RxEnabled, TxEnabled;

    int fd, count, size, no;
    Q3PtrVector<ControlObject> controlList;

    /** List of available midi devices */
    QStringList devices;
    /** Name of current open devices */
    QStringList openDevices;
    /** List of available midi configurations. Initialized upon call to getConfigList() */
    QStringList configs;
    /** Pointer to midi config object*/
    ConfigObject<ConfigValueMidi> *m_pMidiConfig;

    // Pointer to device dialog (for debug output)
    DlgPrefMidiDevice *dlgDevice;
    // Pointer to bindings dialog (for MIDI learn)
    DlgPrefMidiBindings *dlgBindings;

#ifdef __SCRIPT__
    MidiScriptEngine *m_pScriptEngine;
#endif
};

void abortRead(int);

#endif
