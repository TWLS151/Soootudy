# SWEA - 16811
# 당근

# 당근을 박스에 나눠 담는 함수
# AI 는 실제로 리스트를 만들어서 담을 필요 없이
# 문제에서 요구하는 '개수 차이'를 구하기 위한 개수만 구하는 게 더 좋다는 평가
def makeBox(num, i, j, lst):
    small = [lst[x] for x in range(i+1)]
    midium = [lst[x] for x in range(i+1, j+1)]
    large = [lst[x] for x in range(j+1, num)]

    return [small, midium, large]


TC = int(input())

for test_case in range(1, TC+1):
    carrot_num = int(input())
    carrot_size_list = list(map(int, input().split()))
    # ---------------- #

    carrot_size_list.sort()

    # 조건에 부합하는 박스 분류를 모두 담는 리스트
    # AI는 모두 담을 필요 없이 그때그때 조건문으로 걸러내고
    # 차이값을 계산하는게 낫다고 평가함
    passed_box = []
    for i in range(carrot_num - 2):
        # 같은 수가 연속될 때 잘라내면 안되니까 가지치기
        if carrot_size_list[i] == carrot_size_list[i + 1]:
            continue
        for j in range(i + 1, carrot_num - 1):
            # 가지치기
            if carrot_size_list[j] == carrot_size_list[j + 1]:
                continue
            
            # 리스트로 받아낼 필요 없음
            boxes = makeBox(carrot_num, i, j, carrot_size_list)
            
            # 여기서 반복문을 사용할 필요 없이 바로 판별하면 된다고 함
            # 위 함수의 반환값을 a, b, c 같이 세 변수로 받아내고
            # if a > N//2 or b > N//2 or c > N//2:
            #   continue
            # 이렇게 처리하는게 가장 깔끔하다고 했고 실제로 그래 보임
            flag = True
            for box in boxes:
                if len(box) > carrot_num // 2:
                    flag = False
                    break
            
            if flag == True:
                passed_box.append(boxes)
                
    if not passed_box:
        print(f'#{test_case} -1')
        continue

    # AI 방식대로 진행한다면
    # 따로 구할 필요 없다.
    diff = []
    for box in passed_box:
        max_len = 0
        min_len = 1000
        for part in box:
            if len(part) < min_len:
                min_len = len(part)
            if len(part) > max_len:
                max_len = len(part)
        diff.append(max_len - min_len)


    print(f'#{test_case} {min(diff)}')  