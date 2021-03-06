// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import horizontalPodAutoscalerDetailModule from 'horizontalpodautoscalerdetail/horizontalpodautoscalerdetail_module';

describe('Horizontal Pod Autoscaler Info controller', () => {
  /** @type {!HorizontalPodAutoscalerInfoController} */
  let ctrl;

  beforeEach(() => {
    angular.mock.module(horizontalPodAutoscalerDetailModule.name);

    angular.mock.inject(($componentController, $rootScope, $state, $interpolate) => {
      ctrl = $componentController(
          'kdHorizontalPodAutoscalerInfo',
          {$scope: $rootScope, $state: $state, $interpolate: $interpolate}, {
            horizontalPodAutoscaler: {
              objectMeta: {name: 'test', namespace: 'test-namespace'},
              scaleTargetRef: {kind: 'Deployment', name: 'test-deployment'},
            },
          });
      spyOn(ctrl.state_, 'href');
    });
  });

  it('should get a href to the targeted resource', () => {
    ctrl.state_.href.and.callFake((stateName, stateParams) => {
      expect(stateName).toBe('deploymentdetail');
      expect(stateParams.objectNamespace).toBe('test-namespace');
      expect(stateParams.objectName).toBe('test-deployment');
    });
    ctrl.getScaleTargetHref();
    expect(ctrl.state_.href).toHaveBeenCalled();
  });
});
